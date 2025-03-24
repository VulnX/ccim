import 'dart:math';

import 'package:ccim_client/main.dart';
import 'package:flutter/material.dart';

class AddClipPage extends StatelessWidget {
  const AddClipPage({super.key});

  @override
  Widget build(BuildContext context) {
    return MyScaffold(body: AddClipsBody());
  }
}

class AddClipsBody extends StatefulWidget {
  const AddClipsBody({super.key});

  @override
  State<AddClipsBody> createState() => _AddClipsBodyState();
}

class _AddClipsBodyState extends State<AddClipsBody> {
  int _currentStep = 0;
  final List<String> animals = [
    'lion',
    'tiger',
    'elephant',
    'zebra',
    'giraffe',
    'panda',
    'koala',
    'kangaroo',
    'wolf',
    'shark',
  ];

  final List<String> colors = [
    'red',
    'blue',
    'green',
    'yellow',
    'black',
    'white',
    'purple',
    'orange',
    'brown',
    'pink',
  ];

  final List<String> elements = [
    'hydrogen',
    'oxygen',
    'nitrogen',
    'carbon',
    'helium',
    'neon',
    'sodium',
    'iron',
    'gold',
    'silver',
  ];

  String getRandomName() {
    final Random random = Random();
    String randomAnimal = animals[random.nextInt(animals.length)];
    String randomColor = colors[random.nextInt(colors.length)];
    String randomElement = elements[random.nextInt(elements.length)];
    return '$randomColor-$randomElement-$randomAnimal';
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Stepper(
        controlsBuilder: controlsBuilder,
        currentStep: _currentStep,
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() {
              _currentStep -= 1;
            });
          }
        },
        onStepContinue: () {
          if (_currentStep <= 1) {
            setState(() {
              _currentStep += 1;
            });
          }
        },
        onStepTapped: (int index) {
          setState(() {
            _currentStep = index;
          });
        },
        steps: [
          Step(
            title: Text('Details'),
            content: Padding(
              padding: const EdgeInsets.all(16),
              child: TextFormField(
                initialValue: getRandomName(),
                decoration: InputDecoration(
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.grey.shade600),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.grey.shade600),
                  ),
                  labelText: 'NAME',
                  floatingLabelStyle: TextStyle(color: Colors.grey.shade600),
                ),
              ),
            ),
          ),
          Step(title: Text('Paste'), content: Text('kardo paste')),
          Step(title: Text('Protections'), content: ProtectionsStep()),
        ],
      ),
    );
  }

  Widget controlsBuilder(context, details) {
    return Row(
      spacing: 20,
      children: [
        TextButton(
          onPressed: details.onStepContinue,
          style: TextButton.styleFrom(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(3),
            ),
            backgroundColor: Colors.blue.shade600,
            foregroundColor: Colors.white,
          ),
          child: const Text('Next'),
        ),
        TextButton(
          onPressed: details.onStepCancel,
          style: TextButton.styleFrom(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(3),
            ),
            foregroundColor: Colors.black,
            // overlayColor: Colors.transparent,
          ),
          child: const Text('Back'),
        ),
      ],
    );
  }
}

class ProtectionsStep extends StatefulWidget {
  const ProtectionsStep({super.key});

  @override
  State<ProtectionsStep> createState() => _ProtectionsStepState();
}

class _ProtectionsStepState extends State<ProtectionsStep> {
  bool noEncryption = false;
  static const WidgetStateProperty<Icon> thumbIcon =
      WidgetStateProperty<Icon>.fromMap(<WidgetStatesConstraint, Icon>{
        WidgetState.selected: Icon(Icons.check, color: Colors.white,),
        WidgetState.any: Icon(Icons.close),
      });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 20),
      child: ListTile(
        leading: Icon(Icons.security),
        title: Text('Enable end-to-end encryption'),
        trailing: Switch(
          value: noEncryption,
          onChanged: (bool choice) {
            setState(() {
              noEncryption = choice;
            });
          },
          thumbIcon: thumbIcon,
          activeColor: Colors.blue,
        ),
      ),
    );
  }
}
